export interface PageEntry {
  id: string;
  title: string;
  route: string;
  stateCount: number;
  group: string;
}

export const PAGE_GROUPS = [
  'Auth',
  'Onboarding',
  'Dashboard',
  'Specialist',
  'Public',
  'Admin',
] as const;

export const pageRegistry: PageEntry[] = [
  // Landing
  { id: 'landing', title: 'Лендинг', route: '/', stateCount: 3, group: 'Public' },

  // Auth
  { id: 'auth-email', title: 'Вход — Email', route: '/(auth)/email', stateCount: 3, group: 'Auth' },
  { id: 'auth-otp', title: 'Вход — OTP', route: '/(auth)/otp', stateCount: 3, group: 'Auth' },

  // Onboarding
  { id: 'onboarding-username', title: 'Онбординг — Имя', route: '/onboarding/username', stateCount: 2, group: 'Onboarding' },
  { id: 'onboarding-work-area', title: 'Онбординг — Город и услуги', route: '/onboarding/work-area', stateCount: 3, group: 'Onboarding' },
  { id: 'onboarding-profile', title: 'Онбординг — Профиль', route: '/onboarding/profile', stateCount: 2, group: 'Onboarding' },

  // Dashboard (Client)
  { id: 'client-dashboard', title: 'Кабинет заказчика', route: '/(dashboard)', stateCount: 3, group: 'Dashboard' },
  { id: 'my-requests', title: 'Мои запросы', route: '/(dashboard)/requests', stateCount: 4, group: 'Dashboard' },
  { id: 'my-request-detail', title: 'Детали запроса', route: '/(dashboard)/requests/[id]', stateCount: 3, group: 'Dashboard' },
  { id: 'create-request', title: 'Новый запрос', route: '/(dashboard)/requests/new', stateCount: 3, group: 'Dashboard' },
  { id: 'my-responses', title: 'Мои отклики', route: '/(dashboard)/responses', stateCount: 3, group: 'Dashboard' },

  // Specialist
  { id: 'specialist-dashboard', title: 'Кабинет специалиста', route: '/(dashboard)', stateCount: 3, group: 'Specialist' },
  { id: 'specialist-profile', title: 'Профиль специалиста (редактирование)', route: '/(dashboard)/profile', stateCount: 4, group: 'Specialist' },
  { id: 'specialist-catalog', title: 'Каталог специалистов', route: '/specialists', stateCount: 3, group: 'Specialist' },
  { id: 'specialist-detail', title: 'Профиль специалиста (публичный)', route: '/specialists/[nick]', stateCount: 3, group: 'Specialist' },
  { id: 'city-requests', title: 'Запросы в моих городах', route: '/(dashboard)/city-requests', stateCount: 3, group: 'Specialist' },
  { id: 'prom
            issue_url = result.stdout.strip()
            print(f"    🐛 Filed: {issue_url}")
            return issue_url
        else:
            print(f"    ⚠️  gh issue create failed: {result.stderr.strip()}")
            return None
    except FileNotFoundError:
        print("    ⚠️  'gh' CLI not found, skipping issue filing")
