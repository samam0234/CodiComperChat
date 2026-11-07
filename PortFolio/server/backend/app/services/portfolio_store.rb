# data/*.json(PortFolio/scripts/build_data.py가 만든다)을 한 번 읽어 메모리에 둔다.
# DB 없이 도는 읽기 전용 저장소다. 파일이 바뀌면 서버를 다시 띄운다.
class PortfolioStore
  DATA_DIR = Rails.root.join("data")

  class << self
    def portfolio = load("portfolio")
    def sheets = load("sheets")
    def erd = load("erd")

    def page(slug)
      portfolio.dig("pages", slug)
    end

    def sheet(id)
      sheets.find { |s| s["id"] == id || s["name"] == id }
    end

    def sheet_summaries
      sheets.map { |s| { id: s["id"], name: s["name"], title: s["title"], kind: s["kind"], rows: (s["rows"] || s["lines"] || []).size } }
    end

    def erd_table(name)
      table = erd["tables"].find { |t| t["name"] == name }
      return nil unless table

      table.merge(
        "parents" => erd["relations"].select { |r| r["child"] == name },
        "children" => erd["relations"].select { |r| r["parent"] == name }
      )
    end

    # 콘텐츠·시트·테이블을 함께 찾는다(사이트의 빠른 찾기). 대소문자 무시, 최대 30건
    def search(query)
      q = query.to_s.strip.downcase
      return [] if q.length < 2

      hits = []
      portfolio["pages"].each do |slug, page|
        page["sections"].each do |sec|
          text = [sec["title"], sec["body"], *(sec["bullets"] || []), *(sec["table"] || []).flatten].compact.join(" ")
          next unless text.downcase.include?(q)

          hits << { type: "page", slug: slug, title: "#{page['title']} · #{sec['title']}", anchor: sec["id"], snippet: snippet(text, q) }
        end
      end
      sheets.each do |s|
        (s["rows"] || []).each_with_index do |row, i|
          line = row.join(" · ")
          hits << { type: "sheet", id: s["id"], title: "#{s['name']} #{i + 1}행", snippet: snippet(line, q) } if line.downcase.include?(q)
        end
      end
      erd["tables"].each do |t|
        cols = t["columns"].map { |c| c["name"] }.join(" ")
        next unless "#{t['name']} #{cols}".downcase.include?(q)

        hits << { type: "table", name: t["name"], title: "테이블 #{t['name']}", snippet: snippet(cols, q) }
      end
      hits.first(30)
    end

    def reload!
      @cache = {}
    end

    private

    def load(name)
      @cache ||= {}
      @cache[name] ||= JSON.parse(File.read(DATA_DIR.join("#{name}.json"), encoding: "utf-8")).freeze
    end

    def snippet(text, q)
      at = text.downcase.index(q) || 0
      from = [at - 40, 0].max
      (from.positive? ? "…" : "") + text[from, 140].to_s.strip
    end
  end
end
