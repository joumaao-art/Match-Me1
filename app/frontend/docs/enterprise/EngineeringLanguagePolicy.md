# MatchMe Engineering Language Policy

Status: binding for all MatchMe engineering work.
Scope: the web app (`app/frontend`), the mobile app (`app/mobile`), the shared
package (`packages/shared`), database migrations, scripts, tests, and all
engineering documentation.

## 1. Purpose

This policy separates three things that are easy to confuse:

| Concern | Language |
|---------|----------|
| Communication with the project owner | English |
| Engineering artifacts (code, comments, docs, tests, logs) | English |
| Product localization shipped to end users | English + Arabic |

These are independent. English is the only engineering language even though the
product itself ships in two languages, and the presence of non-English text in
localization data never makes non-English text acceptable in engineering
material.

## 2. Rules

1. Engineering documentation must be written in English.
2. Source-code comments must be written in English.
3. Developer-facing logs should be written in English.
4. Test descriptions must be written in English.
5. Architecture documentation must be written in English.
6. Agent-generated implementation reports must be written in English.
7. Atoms must communicate with the project owner in English.
8. Product localization remains English + Arabic.
9. Arabic localization content must not be translated into English merely
   because engineering language is English.

Rule 9 is a correctness rule, not a style rule: Arabic text in the localization
resources is product content. Translating it into English would break the
Arabic experience, so it is explicitly out of scope for any language cleanup.

## 3. Language selection must not be inferred

The engineering language is fixed and must not be derived from context such as:
browser or operating-system locale, network location, the language of existing
files, non-English text found in the repository, previous agent output, terminal
output, or model inference. A repository that happens to contain non-English
data does not change the language of the engineering work performed on it.

## 4. Approved non-English content

The following categories legitimately contain non-English text and must be left
untouched:

| Category | Example | Why it stays |
|----------|---------|--------------|
| Locale display names | the `zh`, `ja`, and `ko` entries of the supported-languages registry | A language is listed by its own native name, exactly like French, Spanish, Urdu, or Hindi. This is reference data, not engineering prose. |
| Language reference table seeds | native display names in `supabase/migrations/*seeds*.sql` | Product data stored in the database. |
| Arabic localization resources | user-visible UI copy in the Arabic resource bundle | Required product localization. |
| Third-party and vendor code | `node_modules`, vendored packages | Owned by upstream maintainers; never edited. |
| User-generated content | resumes, candidate or company records | Belongs to users; never translated or deleted. |

Everything outside these categories should be English. Accidental non-English
engineering text — comments, TODO notes, debug strings, test names, script
output, and developer documentation — must be translated into professional
English rather than deleted, so the technical meaning is preserved.

## 5. Enforcement

`scripts/check-cjk-engineering-text.mjs` scans the engineering-controlled
directories for Han ideographs and reports `FILE`, `LINE`, and `TEXT` for every
occurrence that is not explicitly approved. Run it with:

```bash
pnpm run check:language
```

The check is deliberately narrow: it looks only for Han ideographs, so it can
never flag legitimate Arabic (or any other) localization content. A file may be
approved as a whole, or a single line may be approved with an inline
`cjk-allow` marker; both require a written reason, and neither may be used to
silence a genuine finding.

## 6. Relationship to the Engineering Charter

This policy is a specialization of the localization-first and
documentation-first principles in the MatchMe Engineering Charter
(`docs/enterprise/Engineering Charter.md`). Where the charter says engineering
artifacts must be documented, this policy fixes the language those documents are
written in.
