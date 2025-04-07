using AddressBook.Contracts.Models;

namespace AddressBook.Web;

public interface IAddressBookApiService
{
  Task<GetFilteredContactsResponse?> GetFilteredContactsAsync(string searchTerm);
}