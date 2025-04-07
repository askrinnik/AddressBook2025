using AddressBook.Api.Domain;
using AddressBook.Api.Interfaces;
using AddressBook.Contracts;
using Microsoft.EntityFrameworkCore;

namespace AddressBook.Api.DataAccess;

internal class AddressBookRepository(ApplicationDbContext dbContext) :
  IRetrieveMany<GetFilteredContactsQuery, Contact>,
  IRetrieve<int, Contact>,
  ICreate<Contact>
{
  public async Task<IReadOnlyCollection<Contact>> RetrieveManyAsync(GetFilteredContactsQuery key)
  {
    IQueryable<Contact> query = dbContext.Contacts;
    if (!string.IsNullOrWhiteSpace(key.SearchText))
      query = query.Where(c => c.FirstName.Contains(key.SearchText) || c.LastName.Contains(key.SearchText));
    return await query.AsNoTracking().ToArrayAsync();
  }

  public async Task<Contact?> TryRetrieveAsync(int key) =>
    await dbContext.Contacts
      .Include(c => c.Phones)
      .AsNoTracking()
      .FirstOrDefaultAsync(c => c.Id.Value == key);

  public async Task<Contact> CreateAsync(Contact item)
  {
    dbContext.Contacts.Add(item);
    await dbContext.SaveChangesAsync();
    return item;
  }
}