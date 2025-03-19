using AddressBook.Contracts;
using AddressBook.Web.Domain;
using AddressBook.Web.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AddressBook.Web.DataAccess;

public class AddressBookRepository(ApplicationDbContext dbContext) :
  IRetrieveMany<GetFilteredContactsQuery, Contact>
{
  public async Task<IReadOnlyCollection<Contact>> RetrieveManyAsync(GetFilteredContactsQuery key)
  {
    IQueryable<Contact> query = dbContext.Contacts;
    if (!string.IsNullOrWhiteSpace(key.SearchText))
      query = query.Where(c => c.FirstName.Contains(key.SearchText) || c.LastName.Contains(key.SearchText));
    return await query.ToArrayAsync();
  }
}