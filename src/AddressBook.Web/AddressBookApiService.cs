using System.Net.Http.Json;
using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using AddressBook.Web.Models;

namespace AddressBook.Web;

public class AddressBookApiService(HttpClient httpClient) : IAddressBookApiService
{

    public async Task<GetFilteredContactsResponse?> GetFilteredContactsAsync(string searchTerm, CancellationToken cancellationToken)
    {
        var requestUri = "contacts";
        if (!string.IsNullOrWhiteSpace(searchTerm))
            requestUri += $"?search={searchTerm}";

        var response = await httpClient.GetFromJsonAsync<GetFilteredContactsResponse>(requestUri, cancellationToken);
        return response;
    }

    public async Task DeleteContact(int id)
    {
        var response = await httpClient.DeleteAsync($"contacts/{id}");
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"Error deleting contact: {response.ReasonPhrase}");
    }

    public async Task<int> CreateContact(CreateContactModel model)
    {
        var command = new CreateContactCommand()
        {
            FirstName = model.FirstName,
            LastName = model.LastName,
            Birthday = model.Birthday
        };
        var response = await httpClient.PostAsJsonAsync("contacts", command);

        if (response.IsSuccessStatusCode)
        {
            var idString = response.Headers.Location?.Segments.LastOrDefault();
            var id = int.TryParse(idString, out var parsedId) ? parsedId : 0;
            return id;
        }

        return 0;
    }
}