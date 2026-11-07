# 프론트(Astro)는 다른 도메인(Vercel·Netlify)에서 이 API를 부른다. 허용할 주소는 FRONTEND_ORIGINS(쉼표)로 정한다.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("FRONTEND_ORIGINS", "http://localhost:4321,http://127.0.0.1:4321").split(",").map(&:strip))
    resource "/api/*", headers: :any, methods: %i[get post options], max_age: 600
  end
end
