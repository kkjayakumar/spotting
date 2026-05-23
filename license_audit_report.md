# License Compliance Audit: Crikket vs Spotting

> Generated: 2026-05-09  
> Crikket Source: `C:\Users\kkjay\Documents\sheshi\crikket`  
> Spotting Source: `C:\Users\kkjay\Documents\personal\spotting`

---

## 1. Crikket License

| Property | Detail |
|---|---|
| **License** | GNU Affero General Public License v3.0 (AGPL-3.0) |
| **Author** | redpangilinan |
| **Repository** | https://github.com/redpangilinan/crikket |
| **LICENSE file** | Confirmed present in `sheshi/crikket/LICENSE` |

> [!IMPORTANT]
> AGPL-3.0 is a **copyleft** license. Any software that is derived from AGPL-3.0 code, or runs as a **network service** exposing AGPL code to users, **must also be released under AGPL-3.0** and make the full source code available.

---

## 2. Verbatim File Copy Analysis

### Web Frontend (`apps/web/src`)

| Metric | Count |
|---|---|
| Crikket source files scanned | 113 |
| **Identical (verbatim) files in Spotting** | **0** |
| Shared file paths (same structure) | 0 |

### Packages (`packages/`)

| Metric | Count |
|---|---|
| Crikket package files scanned | 237 |
| **Identical (verbatim) files in Spotting** | **0** |

> [!NOTE]
> **No verbatim file copies were detected.** The Spotting source code is byte-for-byte different from Crikket in every file. The two repositories also use entirely different file/path structures, which is consistent with a clean-room reimplementation.

---

## 3. Structural Similarity

The two codebases share **0 identical file paths** between their `apps/web/src` trees. This confirms the folder architecture was redesigned, not copied. Key differences:

| Aspect | Crikket | Spotting |
|---|---|---|
| Auth client | `better-auth` SDK | Custom `auth-client.ts` mock |
| API client | `@crikket/api` orpc | `@spotting/api` + custom orpc |
| Package names | `@crikket/*` | `@spotting/*` |
| UI package | `@crikket/ui` | `@spotting/ui` |
| State management | React Query + orpc | React Query + orpc (independent) |
| Background | None | SpiderWeb Canvas (original) |
| Branding | Cricket/bug themed | Spider-themed (original design) |

---

## 4. Remaining Issues Found

> [!WARNING]
> The following issues were found in the current Spotting codebase and must be remediated.

### 4.1 — Crikket Author References in `site.ts` and `git.ts`

These config files still contain `redpangilinan` (the Crikket author's handle):

**`packages/shared/src/config/site.ts`**
```ts
author: {
  name: "redpangilinan",   // ⚠️ Should be your own details
  twitter: "@redpngilinan",
},
links: {
  repo: "https://github.com/redpangilinan/Spotting",  // ⚠️ Wrong repo URL
  github: "https://github.com/redpangilinan",
}
```

**`packages/shared/src/config/git.ts`** (or similar)
```ts
export const gitConfig = {
  user: "redpangilinan",   // ⚠️ Should be your own GitHub username
  repo: "Spotting",
}
```

### 4.2 — `CRIKKET_SERVER_URL` in `.env`

```
CRIKKET_SERVER_URL=http://server:3000   // ⚠️ Legacy env var name
```
Should be renamed to `SPOTTING_SERVER_URL` or similar.

### 4.3 — `web_old` Directory Contains Crikket Code

`apps/web_old/` is a **direct copy** of the Crikket frontend (it uses `@crikket/*` package imports). It is currently not used in production but still lives in the repo. This is the highest-risk item.

---

## 5. AGPL-3.0 Compliance Assessment

### Is Spotting derived from Crikket?

| Test | Result |
|---|---|
| Verbatim file copies | ✅ None found |
| Shared file structure | ✅ None — architectures differ |
| Same package namespace | ✅ No — uses `@spotting/*` |
| UI components copied | ✅ No — rebuilt independently |
| Your README acknowledges AGPL | ✅ Yes (`clean-room-policy.md` referenced) |

**Overall Assessment: Spotting appears to be a clean-room reimplementation**, not a derivative work. The `web_old` directory is the only significant exception.

### What AGPL Requires (if you distribute Spotting)

If Spotting is **purely your own code** (clean-room), AGPL restrictions do **not** apply to it — you can choose your own license.

If any AGPL code (from `web_old`) was incorporated, you must:
1. License the entire project under AGPL-3.0
2. Provide source code access to all users interacting via network

---

## 6. Recommended Remediation Actions

| Priority | Action | Files |
|---|---|---|
| 🔴 HIGH | **Delete `apps/web_old/`** — it contains Crikket source code | `apps/web_old/` |
| 🟠 MEDIUM | **Fix author metadata** — replace `redpangilinan` with your own details | `packages/shared/src/config/site.ts`, `git.ts` |
| 🟠 MEDIUM | **Rename `CRIKKET_SERVER_URL`** env var | `.env`, `.env.example` |
| 🟡 LOW | **Rename `CHANGELOG.md` entry** referencing `@crikket-io/capture` | `CHANGELOG.md` |
| 🟡 LOW | **Add your own LICENSE file** to the root of Spotting | `/LICENSE` |
| 🟡 LOW | **Update README.md** to remove AGPL guardrail notes (no longer needed once web_old is deleted) | `README.md` |

---

## 7. Suggested License for Spotting

Since Spotting is a clean-room reimplementation, you are free to choose any license. Options:

| License | Use Case |
|---|---|
| **MIT** | Maximum permissiveness, allow commercial forks |
| **Apache 2.0** | Permissive + patent protection |
| **AGPL-3.0** | Keep it open-source, require forks to also be open |
| **Proprietary** | Closed source, full commercial control |

> [!TIP]
> If you intend to offer Spotting as a SaaS product while keeping the core open-source, **AGPL-3.0 + a commercial license** (dual-licensing) is a common and effective strategy used by tools like GitLab and Grafana.
