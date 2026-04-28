type RubricBlock =
  | {
      type: "keyValue";
      label: string;
      value: string;
    }
  | {
      type: "section";
      title: string;
      body: string;
    }
  | {
      type: "plain";
      body: string;
    };

function parseRubricBlocks(rubric: string): RubricBlock[] {
  return rubric
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const firstLine = lines[0]?.trim() ?? "";

      if (lines.length === 1 && firstLine.includes("：")) {
        const [label, ...rest] = firstLine.split("：");
        return {
          type: "keyValue" as const,
          label,
          value: rest.join("：").trim(),
        };
      }

      if (firstLine.endsWith("：")) {
        return {
          type: "section" as const,
          title: firstLine.slice(0, -1),
          body: lines.slice(1).join("\n").trim(),
        };
      }

      return {
        type: "plain" as const,
        body: block,
      };
    });
}

export function RubricDisplay({ rubric }: { rubric: string }) {
  const blocks = parseRubricBlocks(rubric);

  return (
    <div className="rubric-display">
      {blocks.map((block, index) => {
        if (block.type === "keyValue") {
          return (
            <div className="rubric-highlight" key={`${block.type}-${index}`}>
              <div className="rubric-highlight-label">{block.label}</div>
              <div className="rubric-highlight-value">{block.value}</div>
            </div>
          );
        }

        if (block.type === "section") {
          return (
            <section className="rubric-card" key={`${block.type}-${index}`}>
              <h3 className="rubric-card-title">{block.title}</h3>
              <pre className="rubric-pre">{block.body}</pre>
            </section>
          );
        }

        return (
          <section className="rubric-card" key={`${block.type}-${index}`}>
            <pre className="rubric-pre">{block.body}</pre>
          </section>
        );
      })}
    </div>
  );
}
