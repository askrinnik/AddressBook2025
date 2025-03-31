using AddressBook.Contracts;
using AddressBook.Web.Domain;
using AddressBook.Web.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AddressBook.Web.DataAccess;

internal class AddressBookRepository(ApplicationDbContext dbContext) :
  IRetrieveMany<GetFilteredContactsQuery, Contact>,
  IRetrieve<int, Contact>
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
      .FirstOrDefaultAsync(c => c.Id == key);
}