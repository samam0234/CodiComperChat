require "test_helper"

# AI 서비스 없이 도는 시험: 콘텐츠 API, 검색, 챗봇 프록시(가짜 AiClient), 검증, 요청 한도
class ApiTest < ActionDispatch::IntegrationTest
  setup { Rails.cache.clear }

  # 가짜 AiClient: 받은 인자를 기록하고 정해 둔 답을 돌려준다
  class FakeAi
    attr_reader :calls

    def initialize(reply = [200, { "answer" => "답 [1]", "sources" => [{ "n" => 1 }] }], raise_error: false)
      @reply, @raise, @calls = reply, raise_error, []
    end

    def chat(message:, history:)
      @calls << { message: message, history: history }
      raise AiClient::Unavailable, "down" if @raise

      @reply
    end

    def health
      raise AiClient::Unavailable, "down" if @raise

      [200, { "model" => "gemma4:e4b", "chunks" => 10 }]
    end
  end

  def with_ai(fake)
    AiClient.override = fake
    yield
  ensure
    AiClient.override = nil
  end

  test "health는 AI가 꺼져 있어도 200이고 연결 상태를 알려 준다" do
    with_ai(FakeAi.new(raise_error: true)) { get "/api/v1/health" }
    assert_response :success
    body = response.parsed_body
    assert_equal false, body.dig("ai", "reachable")
    assert_equal 9, body.dig("data", "sheets")
    assert_equal 38, body.dig("data", "tables")
  end

  test "포트폴리오 콘텐츠와 페이지" do
    get "/api/v1/portfolio"
    assert_response :success
    assert_equal "코디컴퍼챗", response.parsed_body.dig("site", "brand")
    assert_match(/max-age=3600/, response.headers["Cache-Control"])

    get "/api/v1/pages/backend"
    assert_response :success
    assert_includes response.parsed_body["sections"].map { |s| s["id"] }, "advanced"

    %w[updates frameworks].each do |slug|
      get "/api/v1/pages/#{slug}"
      assert_response :success
      assert response.parsed_body["sections"].any?
    end

    get "/api/v1/pages/nope"
    assert_response :not_found
  end

  test "스프레드시트 목록과 시트" do
    get "/api/v1/sheets"
    list = response.parsed_body
    assert_equal 9, list.size
    get "/api/v1/sheets/#{list.first['id']}"
    assert_response :success
    assert response.parsed_body["rows"].any?
    get "/api/v1/sheets/s99"
    assert_response :not_found
  end

  test "ERD와 테이블 관계" do
    get "/api/v1/erd"
    assert_equal 41, response.parsed_body.dig("counts", "relations")
    get "/api/v1/erd/tables/campaigns"
    t = response.parsed_body
    assert_includes t["parents"].map { |r| r["parent"] }, "users"
    assert_includes t["children"].map { |r| r["child"] }, "sessions"
  end

  test "검색은 페이지·시트·테이블을 함께 찾는다" do
    get "/api/v1/search", params: { q: "퀘스트" }
    types = response.parsed_body["hits"].map { |h| h["type"] }.uniq
    assert_includes types, "page"
    assert_includes types, "sheet"
    get "/api/v1/search", params: { q: "a" }
    assert_empty response.parsed_body["hits"]
  end

  test "챗봇 질문을 AI로 넘기고 기록은 최근 것만, 역할이 맞는 것만 보낸다" do
    fake = FakeAi.new
    history = Array.new(15) { |i| { role: i.even? ? "user" : "assistant", content: "턴 #{i}" } } + [{ role: "system", content: "무시" }]
    with_ai(fake) { post "/api/v1/chat", params: { message: "  비밀 퀘스트?  ", history: history }, as: :json }
    assert_response :success
    assert_equal "답 [1]", response.parsed_body["answer"]
    call = fake.calls.first
    assert_equal "비밀 퀘스트?", call[:message]
    assert_equal 11, call[:history].size # 마지막 12개 중 system 하나 제외
    assert(call[:history].all? { |t| %w[user assistant].include?(t[:role]) })
  end

  test "챗봇 검증과 AI 장애" do
    with_ai(FakeAi.new) { post "/api/v1/chat", params: { message: "" }, as: :json }
    assert_response :bad_request
    with_ai(FakeAi.new) { post "/api/v1/chat", params: { message: "가" * 1001 }, as: :json }
    assert_response :bad_request
    with_ai(FakeAi.new(raise_error: true)) { post "/api/v1/chat", params: { message: "안녕" }, as: :json }
    assert_response :service_unavailable
    with_ai(FakeAi.new([503, { "error" => "모델 없음" }])) { post "/api/v1/chat", params: { message: "안녕" }, as: :json }
    assert_response :service_unavailable
  end

  test "챗봇은 1분에 6번까지" do
    with_ai(FakeAi.new) do
      6.times { post "/api/v1/chat", params: { message: "안녕" }, as: :json }
      assert_response :success
      post "/api/v1/chat", params: { message: "안녕" }, as: :json
    end
    assert_response :too_many_requests
  end

  test "CORS는 허용한 프론트 주소만" do
    get "/api/v1/sheets", headers: { "Origin" => "http://localhost:4321" }
    assert_equal "http://localhost:4321", response.headers["Access-Control-Allow-Origin"]
    get "/api/v1/sheets", headers: { "Origin" => "https://evil.example" }
    assert_nil response.headers["Access-Control-Allow-Origin"]
  end
end
