// Font registration for @react-pdf/renderer, mirroring render_pdfs.py's
// font choices exactly: DM Sans Bold for EN headings/display roles, Inter
// (Regular/Bold/Italic) for body text and GR headings (DM Sans has no Greek
// glyph coverage — see render_pdfs.py build_styles()).
import { Font } from "@react-pdf/renderer";
import interRegularUrl from "../../assets/fonts/Inter-Regular.ttf?url";
import interBoldUrl from "../../assets/fonts/Inter-Bold.ttf?url";
import interItalicUrl from "../../assets/fonts/Inter-Italic.ttf?url";
import dmSansBoldUrl from "../../assets/fonts/DMSans-Bold.ttf?url";
import dmSansMediumUrl from "../../assets/fonts/DMSans-Medium.ttf?url";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Inter",
    fonts: [
      { src: interRegularUrl, fontWeight: "normal" },
      { src: interBoldUrl, fontWeight: "bold" },
      { src: interItalicUrl, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: "DMSans-Bold",
    fonts: [{ src: dmSansBoldUrl, fontWeight: "bold" }],
  });

  Font.register({
    family: "DMSans-Medium",
    fonts: [{ src: dmSansMediumUrl, fontWeight: "normal" }],
  });
}

// bold_display equivalent from render_pdfs.py: DM Sans for EN, Inter-Bold (via
// Inter family bold weight) for GR since DM Sans lacks Greek glyphs.
export function displayFontFamily(lang: string): string {
  return lang === "en" ? "DMSans-Bold" : "Inter";
}
