require "net/http"

# Flask AI 서비스(PortFolio/server/ai_services)를 부른다.
# 브라우저는 AI 서비스 주소를 모르고, 여기서 내부 토큰을 붙여 넘긴다.
class AiClient
  class Unavailable < StandardError; end

  # 시험에서 가짜를 끼우는 자리(minitest 6에는 stub이 없다). 운영에서는 비어 있다
  class << self
    attr_accessor :override

    def build(**opts) = override || new(**opts)
  end

  def initialize(base_url: ENV.fetch("AI_SERVICE_URL", "http://127.0.0.1:5001"), token: ENV.fetch("AI_INTERNAL_TOKEN", ""),
                 read_timeout: ENV.fetch("AI_READ_TIMEOUT_SECONDS", "240").to_i)
    @base = URI(base_url)
    @token = token
    @read_timeout = read_timeout
  end

  def chat(message:, history:)
    post("/chat", { message: message, history: history })
  end

  def graph = get("/graph")
  def health = get("/health")

  private

  def post(path, body)
    req = Net::HTTP::Post.new(path, headers)
    req.body = body.to_json
    request(req)
  end

  def get(path)
    request(Net::HTTP::Get.new(path, headers))
  end

  def headers
    h = { "Content-Type" => "application/json", "Accept" => "application/json" }
    h["X-Internal-Token"] = @token if @token.present?
    h
  end

  def request(req)
    res = Net::HTTP.start(@base.host, @base.port, use_ssl: @base.scheme == "https", open_timeout: 5, read_timeout: @read_timeout) do |http|
      http.request(req)
    end
    [res.code.to_i, JSON.parse(res.body.presence || "{}")]
  rescue Errno::ECONNREFUSED, Errno::EHOSTUNREACH, Net::OpenTimeout, Net::ReadTimeout, SocketError, JSON::ParserError => e
    raise Unavailable, e.class.name
  end
end
