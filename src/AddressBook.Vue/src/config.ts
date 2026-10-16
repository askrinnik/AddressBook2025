/** Base URL of the API; the fallback matches the one used by AddressBook.Web. */
export const apiPrefix: string = import.meta.env.VITE_API_PREFIX ?? 'http://localhost:5000/api/';
