using AddressBook.Contracts.Models;
using System.Net.Http.Json;

namespace AddressBook.Web.Client.Pages;

public partial class Contacts
{
  private string _status = "Press Search button";
  private string _searchTerm = string.Empty;
  private ContactModel[]? _contacts;
  private bool _isLoading;

  private async Task LoadContacts()
  {
    try
    {
      _contacts = null;
      _status = "Loading...";
      _isLoading = true;

      var requestUri = "/api/contacts";
      if (!string.IsNullOrWhiteSpace(_searchTerm))
        requestUri += $"?search={_searchTerm}";

      var response = await Http.GetFromJsonAsync<GetFilteredContactsResponse>(requestUri);
      _contacts = response?.Rows.ToArray();
    }
    catch (Exception ex)
    {
      _status = $"Error: {ex.Message}";
    }
    finally
    {
      _isLoading = false;
    }
  }

  private async Task SearchContacts()
  {
    await LoadContacts();
  }

  private async Task ClearSearch()
  {
    _searchTerm = string.Empty;
    await LoadContacts();
  }
}