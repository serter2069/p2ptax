#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = "/Users/sergei/Documents/Projects/Ruslan/p2ptax";

const FILES = [
  "app/(admin-tabs)/dashboard.tsx",
  "app/(tabs)/index.tsx",
  "app/(tabs)/messages.tsx",
  "app/(tabs)/public-requests.tsx",
  "app/(tabs)/requests.tsx",
  "app/index.tsx",
  "app/login.tsx",
  "app/onboarding/name.tsx",
  "app/onboarding/profile.tsx",
  "app/onboarding/work-area.tsx",
  "app/otp.tsx",
  "app/requests/[id]/detail.tsx",
  "app/requests/[id]/index.tsx",
  "app/requests/[id]/messages.tsx",
  "app/requests/[id]/write.tsx",
  "app/requests/index.tsx",
  "app/requests/new.tsx",
  "app/settings/index.tsx",
  "app/specialists/[id].tsx",
  "app/specialists/index.tsx",
  "components/Header.tsx",
  "components/HeaderHome.tsx",
  "components/layout/AppHeader.tsx",
  "components/layout/MobileDrawer.tsx",
  "components/layout/SidebarNav.tsx",
  "components/MobileMenu.tsx",
  "components/requests/ThreadsList.tsx",
  "lib/useRequireAuth.ts",
];

// Build replacement pairs: [old_pattern, new_push, new_replace]
const REPLACEMENTS = [
  // [route_string, push_call, replace_call]
  ['"/"',                       'nav.routes.home()',               'nav.replaceRoutes.home()'],
  ['"/login"',                  'nav.routes.login()',              'nav.replaceRoutes.login()'],
  ['"/otp"',                    'nav.routes.otp()',                'nav.replaceRoutes.otp()'],
  ['"/brand"',                  'nav.routes.brand()',              'nav.replaceRoutes.brand()'],
  ['"/notifications"',          'nav.routes.notifications()',      'nav.replaceRoutes.notifications()'],
  ['"/(tabs)"',                 'nav.routes.tabs()',               'nav.replaceRoutes.tabs()'],
  ['"/(tabs)/requests"',        'nav.routes.tabsRequests()',       'nav.replaceRoutes.tabsRequests()'],
  ['"/(tabs)/messages"',        'nav.routes.tabsMessages()',       'nav.replaceRoutes.tabsMessages()'],
  ['"/(tabs)/public-requests"', 'nav.routes.tabsPublicRequests()', 'nav.replaceRoutes.tabsPublicRequests()'],
  ['"/(tabs)/create"',          'nav.routes.tabsCreate()',         'nav.replaceRoutes.tabsCreate()'],
  ['"/(tabs)/profile"',         'nav.routes.tabsProfile()',        'nav.replaceRoutes.tabsProfile()'],
  ['"/(tabs)/search"',          'nav.routes.tabsSearch()',         'nav.replaceRoutes.tabsSearch()'],
  ['"/(admin-tabs)/dashboard"', 'nav.routes.adminDashboard()',     'nav.replaceRoutes.adminDashboard()'],
  ['"/(admin-tabs)/users"',     'nav.routes.adminUsers()',         'nav.replaceRoutes.adminUsers()'],
  ['"/(admin-tabs)/complaints"', 'nav.routes.adminComplaints()',   'nav.replaceRoutes.adminComplaints()'],
  ['"/(admin-tabs)/moderation"', 'nav.routes.adminModeration()',   'nav.replaceRoutes.adminModeration()'],
  ['"/admin/settings"',         'nav.routes.adminSettings()',      'nav.replaceRoutes.adminSettings()'],
  ['"/auth/email"',             'nav.routes.authEmail()',          'nav.replaceRoutes.authEmail()'],
  ['"/onboarding/name"',        'nav.routes.onboardingName()',     'nav.replaceRoutes.onboardingName()'],
  ['"/onboarding/profile"',     'nav.routes.onboardingProfile()',  'nav.replaceRoutes.onboardingProfile()'],
  ['"/onboarding/work-area"',   'nav.routes.onboardingWorkArea()', 'nav.replaceRoutes.onboardingWorkArea()'],
  ['"/requests"',               'nav.routes.requests()',           'nav.replaceRoutes.requests()'],
  ['"/requests/new"',           'nav.routes.requestsNew()',        'nav.replaceRoutes.requestsNew()'],
  ['"/settings"',               'nav.routes.settings()',           'nav.replaceRoutes.settings()'],
  ['"/specialists"',            'nav.routes.specialists()',        'nav.replaceRoutes.specialists()'],
  ['"/legal/terms"',            'nav.routes.legalTerms()',         'nav.replaceRoutes.legalTerms()'],
  ['"/legal/privacy"',          'nav.routes.legalPrivacy()',       'nav.replaceRoutes.legalPrivacy()'],
];

function processFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  let content = fs.readFileSync(fullPath, "utf-8");
  let modified = false;

  if (!content.includes("as never")) {
    console.log("  SKIP " + relativePath + " (no 'as never')");
    return false;
  }

  // Step 1: Add useTypedRouter import
  if (!content.includes("useTypedRouter")) {
    content = content.replace(
      /(import\s*\{[^}]*\}\s*from\s*"expo-router";)/,
      '$1\nimport { useTypedRouter } from "@/lib/navigation";'
    );
    modified = true;
  }

  // Step 2: Add hook call after useRouter()
  if (!content.includes("useTypedRouter()")) {
    content = content.replace(
      /(const\s+router\s*=\s*useRouter\(\));/,
      '$1\n  const nav = useTypedRouter();'
    );
    modified = true;
  }

  // Step 3: Handle object-based push: router.push({ pathname: "/otp" as never, params: {...} } as never);
  if (content.includes('pathname:') && content.includes('as never')) {
    content = content.replace(
      /router\.push\(\{\s*pathname:\s*("([^"]+)"\s+as\s+never),\s*([^}]*)\}\s+as\s+never\)/g,
      function(m, pathnamePart, pathname, params) {
        modified = true;
        return 'nav.any({ pathname: ' + pathname + ', ' + params + '})';
      }
    );
  }

  // Step 4: Template literal dynamic routes
  content = content.replace(
    /router\.push\(`([^`]*)`\s+as\s+never\)/g,
    function(m, inner) {
      modified = true;
      return 'nav.any(`' + inner + '`)';
    }
  );

  content = content.replace(
    /router\.replace\(`([^`]*)`\s+as\s+never\)/g,
    function(m, inner) {
      modified = true;
      return 'nav.replaceAny(`' + inner + '`)';
    }
  );

  // Step 5: Variable-based: router.push(link.href as never)
  content = content.replace(
    /router\.push\((\w[\w.]*)\s+as\s+never\)/g,
    function(m, varName) {
      modified = true;
      return 'nav.any(' + varName + ')';
    }
  );

  content = content.replace(
    /router\.replace\((\w[\w.]*)\s+as\s+never\)/g,
    function(m, varName) {
      modified = true;
      return 'nav.replaceAny(' + varName + ')';
    }
  );

  // Step 6: Static string literal routes — do these last to avoid conflicts
  for (const [routeStr, pushCall, replaceCall] of REPLACEMENTS) {
    // Double-quoted: router.push("/path" as never)
    content = content.split('router.push(' + routeStr + ' as never)').join(pushCall);
    content = content.split('router.replace(' + routeStr + ' as never)').join(replaceCall);
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, "utf-8");
    console.log("  OK   " + relativePath);
  } else {
    console.log("  SKIP " + relativePath + " (no changes)");
  }

  return modified;
}

let count = 0;
for (const f of FILES) {
  if (processFile(f)) count++;
}
console.log("\nDone. Modified " + count + "/" + FILES.length + " files.");
