module Api
  module V1
    # 백엔드 상태 + AI 서비스 연결 여부(AI가 꺼져 있어도 콘텐츠 API는 돈다)
    class HealthController < ApplicationController
      def show
        ai = begin
          code, body = AiClient.build(read_timeout: 5).health
          { reachable: code == 200, model: body["model"], chunks: body["chunks"], ollama: body["ollama"] }
        rescue AiClient::Unavailable
          { reachable: false }
        end
        render json: {
          status: "ok", service: "portfolio-backend", rails: Rails.version, ruby: RUBY_VERSION,
          data: { sheets: PortfolioStore.sheets.size, tables: PortfolioStore.erd["tables"].size, pages: PortfolioStore.portfolio["pages"].keys },
          ai: ai
        }
      end
    end
  end
end
