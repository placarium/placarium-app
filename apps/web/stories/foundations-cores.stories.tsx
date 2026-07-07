import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import brand from "../../../assets/brand/tokens/colors.json";

/**
 * Documentação viva dos tokens de cor da marca (fonte: assets/brand/tokens/colors.json).
 * Este é o ÚNICO lugar da UI onde valores de cor aparecem "crus" — e mesmo aqui
 * eles vêm do JSON canônico, nunca digitados à mão. Regras: DESIGN.md.
 */
const groups = Object.entries(brand.placarium).filter(
  ([, values]) => typeof values === "object" && values !== null,
) as Array<[string, Record<string, string>]>;

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 120 }}>
      <div
        style={{
          height: 56,
          borderRadius: 8,
          background: value,
          border: "1px solid rgba(128,128,128,0.35)",
        }}
      />
      <span style={{ fontSize: 12, fontFamily: "monospace" }}>{name}</span>
      <span style={{ fontSize: 11, fontFamily: "monospace", opacity: 0.7 }}>{value}</span>
    </div>
  );
}

function Palette() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: 16 }}>
      {groups.map(([group, values]) => (
        <section key={group}>
          <h2 style={{ fontSize: 14, marginBottom: 12, textTransform: "capitalize" }}>{group}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {Object.entries(values)
              .filter(([, value]) => typeof value === "string" && value.startsWith("#"))
              .map(([name, value]) => (
                <Swatch key={name} name={name} value={value} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const meta = {
  title: "Fundações/Cores",
  component: Palette,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Palette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tokens: Story = {};
