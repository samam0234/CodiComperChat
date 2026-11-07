# 포트폴리오 API. 프론트(Astro)가 콘텐츠·스프레드시트·ERD를 읽고, 챗봇 질문을 보낸다.
# 챗봇 질문은 여기서 Flask AI 서비스로 넘긴다(브라우저는 AI 서비스 주소를 모른다).
Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"
      get "portfolio", to: "content#portfolio"
      get "pages/:slug", to: "content#page", as: :page
      get "sheets", to: "content#sheets"
      get "sheets/:id", to: "content#sheet", as: :sheet
      get "erd", to: "content#erd"
      get "erd/tables/:name", to: "content#erd_table", as: :erd_table
      get "search", to: "content#search"
      post "chat", to: "chat#create"
      get "chat/graph", to: "chat#graph"
    end
  end
end
