using System.Net.Http.Json;
using AddressBook.Contracts.Models;

namespace AddressBook.Web;

public class AddressBookApiService(HttpClient httpClient) : IAddressBookApiService
{

  public async Task<GetFilteredContactsResponse?> GetFilteredContactsAsync(string searchTerm)
  {
    var requestUri = "contacts";
    if (!string.IsNullOrWhiteSpace(searchTerm))
      requestUri += $"?search={searchTerm}";

    var response = await httpClient.GetFromJsonAsync<GetFilteredContactsResponse>(requestUri);
    return response;
  }
}