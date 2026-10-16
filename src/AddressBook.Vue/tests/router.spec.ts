import router from '@/router';
import { beforeEach, describe, expect, it } from 'vitest';

describe('router', () => {
  beforeEach(async () => {
    await router.push('/');
  });

  it.each([
    ['/', 'Home'],
    ['/contacts', 'Contacts'],
    ['/edit-contact/12', 'Edit Contact'],
    ['/nowhere', 'Not found'],
  ])('sets the document title of %s to "%s"', async (path, title) => {
    await router.push(path);

    expect(document.title).toBe(title);
  });

  it('uses the default title for a route without one', async () => {
    await router.push('/create-contact');

    expect(document.title).toBe('AddressBook');
  });

  it('passes the numeric id of the edit route as a prop', async () => {
    const route = router.resolve('/edit-contact/12');

    expect(route.name).toBe('edit-contact');
    const props = route.matched[0].props.default as (r: typeof route) => unknown;
    expect(props(route)).toEqual({ id: 12 });
  });

  it.each([['/edit-contact/abc'], ['/edit-contact/'], ['/edit-contact/1.5'], ['/edit-contact/-1']])(
    'sends %s to the not-found route',
    (path) => {
      expect(router.resolve(path).name).toBe('not-found');
    },
  );

  it('names the routes of the pages', () => {
    expect(router.resolve('/').name).toBe('home');
    expect(router.resolve('/contacts').name).toBe('contacts');
    expect(router.resolve('/create-contact').name).toBe('create-contact');
  });
});
