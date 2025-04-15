using AddressBook.Api.Domain;
using AddressBook.Api.Interfaces;
using AddressBook.Contracts;
using Microsoft.EntityFrameworkCore;
// ReSharper disable EntityFramework.UnsupportedServerSideFunctionCall

namespace AddressBook.Api.DataAccess;

internal class AddressBookRepository(ApplicationDbContext dbContext) :
  IRetrieveMany<GetFilteredContactsQuery, Contact>,
  IRetrieve<ContactId, Contact>,
  ICreate<Contact>,
  IDelete<ContactId>,
  IExist<ContactId>
{
  public async Task<IReadOnlyCollection<Contact>> RetrieveManyAsync(GetFilteredContactsQuery key)
  {
    IQueryable<Contact> query = dbContext.Contacts;
    if (!string.IsNullOrWhiteSpace(key.SearchText))
      query = query.Where(c => c.FirstName.Contains(key.SearchText) || c.LastName.Contains(key.SearchText));
    return await query.AsNoTracking().ToArrayAsync();
  }

  public async Task<Contact?> TryRetrieveAsync(ContactId key) =>
    await dbContext.Contacts
      .Include(c => c.Phones)
      .AsNoTracking()
      .FirstOrDefaultAsync(c => c.Id.Unwrap() == key.Value);

  public async Task<Contact> CreateAsync(Contact item)
  {
    dbContext.Contacts.Add(item);
    await dbContext.SaveChangesAsync();
    return item;
  }

  public async Task<int> DeleteAsync(ContactId key) => 
      await dbContext.Contacts.Where(c => c.Id.Unwrap() == key.Value).ExecuteDeleteAsync();

  public async Task<bool> ExistAsync(ContactId key) => 
      await dbContext.Contacts.AnyAsync(c => c.Id.Unwrap() == key.Value);
}