export function cleanBulkText(raw: string): string {
  let text = raw;

  text = text.replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF\uFFFC]/g, "");


  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

 
  text = text.replace(/\b([A-Za-zΩαβγδεζηθικλμνξπρστυφχψω]{1,3})\n\1\n/g, "$1\n");
  text = text.replace(/\b([A-Za-z]{1,3})\n\1 ?\n/g, "$1\n");

 
  text = text.replace(/([A-Za-z]) (\d)\n[ \t]*/g, "$1$2");   
  text = text.replace(/([A-Za-z])\n(\d) ?\n/g, "$1$2");       

  text = text.replace(/\(([A-Za-z]) (\d) ?\)/g, "($1^$2)");


  function convertFrac(s: string): string {
   
    let prev = "";
    while (prev !== s) {
      prev = s;
      s = s.replace(/k?frac\(([^,()]+),([^()]+)\)/g, "\\frac{$1}{$2}");
    }
    return s;
  }
  text = convertFrac(text);

 
  text = text.replace(/\brac\(([^,()]+),([^()]+)\)/g, "\\frac{$1}{$2}");

  text = convertFrac(text);

  
  const greekDups: [RegExp, string][] = [
    [/ϵ\nϵ|ϵϵ/g, "ε"],
    [/Ω\nΩ|ΩΩ/g, "Ω"],
    [/ρ\nρ|ρρ/g, "ρ"],
    [/μ\nμ|μμ/g, "μ"],
    [/θ\nθ|θθ/g, "θ"],
    [/α\nα|αα/g, "α"],
    [/β\nβ|ββ/g, "β"],
    [/λ\nλ|λλ/g, "λ"],
  ];
  for (const [pattern, replacement] of greekDups) {
    text = text.replace(pattern, replacement);
  }


  text = text.replace(/(\d+)\s*deg\b/gi, "$1°");

  
  text = text.replace(/([A-Za-z]) (\d) ?\n/g, "$1^$2\n");


  text = text.replace(/\b([A-Z]{1,2})\1\b/g, "$1");


  text = text.replace(/∝frac/g, "∝ \\frac");
  text = text.replace(/⇒/g, "⇒ ");


  text = text.replace(/^([A-D])\)(?!\s)/gm, "$1) ");


  text = text.replace(/^(ANSWER|ANS)\s*:\s*([A-D])/gim, "ANSWER: $2");


  text = text
    .split("\n")
    .filter((line) => {
      const t = line.trim();
     
      if (t.length === 0) return true;

      if (/^[A-Za-z0-9\u200B​]{1,3}$/.test(t)) return false;
      return true;
    })
    .join("\n");


  text = text.replace(/\n{4,}/g, "\n\n\n");

 
  text = text.replace(/(CHAPTER \d+:[^\n]+)\n(\d+\))/g, "$1\n\n$2");

  return text.trim();
}



export function splitMergedAnswers(text: string): string {
  return text
    .replace(/ANSWER:\s*([A-D])EXPLANATION:/gi, "ANSWER: $1\nEXPLANATION: ")
    .replace(/ANSWER:\s*([A-D])([A-Z])/g, "ANSWER: $1\n$2");
}

export function fullClean(raw: string): string {
  return splitMergedAnswers(cleanBulkText(raw));
}