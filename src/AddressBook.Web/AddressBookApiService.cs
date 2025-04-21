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

  public async Task DeleteContact(int id)
    {
        var response = await httpClient.DeleteAsync($"contacts/{id}");
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"Error deleting contact: {response.ReasonPhrase}");
    }
}