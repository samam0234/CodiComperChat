ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    # 요청 한도 시험이 같은 메모리 캐시를 쓰므로 순서대로 돈다
    parallelize(workers: 1)

    # Add more helper methods to be used by all tests here...
  end
end
