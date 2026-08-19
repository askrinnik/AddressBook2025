/*
 * Centralised `data-testid` constants for the AddressBook.Web UI.
 *
 * These mirror the literal `data-testid` attributes added to the Blazor markup
 * (Layout/MainLayout.razor, Layout/NavMenu.razor, Pages/Contacts.razor,
 * Pages/CreateContact.razor, Pages/EditContact.razor). The Razor markup is the
 * counterpart source of truth for the app; keep the two in sync when either changes.
 *
 * Convention: kebab-case, hierarchical `{area}-{control}`. Per-row controls are
 * id-suffixed (see the helper functions below) so each row's control is unique on a
 * shared database and under parallel runs.
 */
export const TestIds = {
  // App shell (MainLayout / NavMenu)
  drawerToggle: 'app-drawer-toggle',
  themeToggle: 'app-theme-toggle',
  navHome: 'nav-home',
  navContacts: 'nav-contacts',

  // Contacts page (Contacts.razor)
  contactsCreate: 'contacts-create',
  contactsSearch: 'contacts-search',
  contactsTable: 'contacts-table',
  // Destructive "Yes" button in the delete confirmation dialog.
  // (The dialog's "Cancel" keeps its visible text and is located by accessible name.)
  contactDeleteConfirm: 'contact-delete-confirm',

  // Contact form, shared by CreateContact.razor and EditContact.razor
  contactFormFirstName: 'contact-form-first-name',
  contactFormLastName: 'contact-form-last-name',
  contactFormBirthday: 'contact-form-birthday',
  // One id for both the create "Create" and edit "Save" submit buttons.
  contactFormSubmit: 'contact-form-submit',
  contactFormCancel: 'contact-form-cancel',
} as const;

// Per-row (id-suffixed) controls in the contacts table.
export const contactRow = (id: number | string): string => `contact-row-${id}`;
export const contactEditButton = (id: number | string): string => `contact-edit-${id}`;
export const contactDeleteButton = (id: number | string): string => `contact-delete-${id}`;
