using AddressBook.Contracts.Models;
using AddressBook.Web.Models;

namespace AddressBook.Web;

public interface IAddressBookApiService
{
  Task<GetFilteredContactsResponse?> GetFilteredContactsAsync(string searchTerm, CancellationToken cancellationToken);
  Task DeleteContact(int id);
  Task<int> CreateContact(CreateContactModel model);
}