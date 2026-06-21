// Lightweight, dependency-free spam heuristics for the public contact form.
//
// Targets automated form-filling bots that submit random gibberish in every
// field (e.g. name "cMLxvLPWtixXgapKifQy", phone "VxBDBJMvOjgxRglrgSWnr").
// Designed to be conservative: real customer messages should never be flagged.

type ContactFields = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

// True when a single token looks like a randomly generated string rather than
// real words: too few vowels, erratic case switching, or a long consonant run.
function looksRandom(value: string): boolean {
  const trimmed = value.trim();
  // Real names/messages contain spaces; only judge single-token blobs here.
  if (trimmed.length < 10 || /\s/.test(trimmed)) return false;

  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length < 10) return false;

  const vowels = (letters.match(/[aeiou]/gi) || []).length;
  const vowelRatio = vowels / letters.length;

  let caseSwitches = 0;
  for (let i = 1; i < letters.length; i++) {
    const prevLower = letters[i - 1] >= "a" && letters[i - 1] <= "z";
    const curLower = letters[i] >= "a" && letters[i] <= "z";
    if (prevLower !== curLower) caseSwitches++;
  }
  const caseSwitchRatio = caseSwitches / letters.length;

  let run = 0;
  let maxConsonantRun = 0;
  for (const ch of letters.toLowerCase()) {
    if ("aeiou".includes(ch)) {
      run = 0;
    } else {
      run++;
      if (run > maxConsonantRun) maxConsonantRun = run;
    }
  }

  return vowelRatio < 0.25 || caseSwitchRatio > 0.4 || maxConsonantRun >= 6;
}

// A real phone number is mostly digits and separators. Lots of letters is a
// strong bot signal.
function phoneLooksFake(phone: string): boolean {
  const letterCount = (phone.match(/[A-Za-z]/g) || []).length;
  return letterCount >= 4;
}

export function detectSpam(fields: ContactFields): { spam: boolean; reason?: string } {
  if (looksRandom(fields.name)) {
    return { spam: true, reason: "random-name" };
  }
  if (looksRandom(fields.message)) {
    return { spam: true, reason: "random-message" };
  }
  if (fields.phone && phoneLooksFake(fields.phone)) {
    return { spam: true, reason: "letters-in-phone" };
  }
  return { spam: false };
}
