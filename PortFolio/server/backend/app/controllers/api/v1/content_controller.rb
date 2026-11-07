module Api
  module V1
    # 읽기 전용 콘텐츠 API. 응답은 공개 자료라 한 시간 캐시한다
    class ContentController < ApplicationController
      before_action { expires_in 1.hour, public: true }

      def portfolio
        render json: PortfolioStore.portfolio
      end

      def page
        page = PortfolioStore.page(params[:slug])
        return render(json: { error: "없는 페이지예요." }, status: :not_found) unless page

        render json: page
      end

      def sheets
        render json: PortfolioStore.sheet_summaries
      end

      def sheet
        sheet = PortfolioStore.sheet(params[:id])
        return render(json: { error: "없는 시트예요." }, status: :not_found) unless sheet

        render json: sheet
      end

      def erd
        render json: PortfolioStore.erd
      end

      def erd_table
        table = PortfolioStore.erd_table(params[:name])
        return render(json: { error: "없는 테이블이에요." }, status: :not_found) unless table

        render json: table
      end

      def search
        render json: { query: params[:q].to_s, hits: PortfolioStore.search(params[:q]) }
      end
    end
  end
end
