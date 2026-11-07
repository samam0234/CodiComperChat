module Api
  module V1
    # 챗봇 질문을 Flask AI 서비스로 넘긴다. 대화 기록은 브라우저 localStorage에 있고, 요청마다 최근 것만 함께 온다.
    # 서버는 대화를 저장하지 않는다.
    class ChatController < ApplicationController
      MAX_MESSAGE = 1000
      MAX_HISTORY = 12

      # 모델 호출은 무겁다: IP당 1분에 6번
      rate_limit to: 6, within: 1.minute, only: :create,
                 with: -> { render json: { error: "질문이 너무 잦아요. 1분 뒤 다시 시도해 주세요." }, status: :too_many_requests }

      def create
        message = params[:message].to_s.strip
        return render(json: { error: "질문을 입력해 주세요." }, status: :bad_request) if message.empty?
        return render(json: { error: "질문은 #{MAX_MESSAGE}자까지예요." }, status: :bad_request) if message.length > MAX_MESSAGE

        code, body = AiClient.build.chat(message: message, history: history_param)
        render json: body, status: code
      rescue AiClient::Unavailable
        render json: { error: "AI 서비스에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요." }, status: :service_unavailable
      end

      def graph
        _, body = AiClient.build(read_timeout: 10).graph
        render json: body
      rescue AiClient::Unavailable
        render json: { error: "AI 서비스에 연결하지 못했어요." }, status: :service_unavailable
      end

      private

      def history_param
        raw = params[:history]
        list = raw.is_a?(Array) || raw.is_a?(ActionController::Parameters) ? Array(raw) : []
        list.last(MAX_HISTORY).filter_map do |t|
          h = t.respond_to?(:to_unsafe_h) ? t.to_unsafe_h : t.to_h
          role = h["role"].to_s
          next unless %w[user assistant].include?(role)

          { role: role, content: h["content"].to_s[0, 2000] }
        end
      end
    end
  end
end
