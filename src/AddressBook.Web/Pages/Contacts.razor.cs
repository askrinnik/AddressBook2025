using AddressBook.Contracts.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace AddressBook.Web.Pages;

public partial class Contacts
{
  private string _status = "Press Search button";
  private string _searchTerm = string.Empty;
  private ContactModel[]? _contacts;
  private bool _isLoading;

  [Inject]
  public IAddressBookApiService AddressBookApiService { get; set; } = null!;

  [Inject]
  public IJSRuntime JsRuntime { get; set; } = null!;

    private async Task LoadContacts()
  {
    try
    {
      _contacts = null;
      _status = "Loading...";
      _isLoading = true;

      var response = await AddressBookApiService.GetFilteredContactsAsync(_searchTerm);
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

  private async Task SearchContacts() => await LoadContacts();

  private async Task ClearSearch()
  {
    _searchTerm = string.Empty;
    await LoadContacts();
  }

    private async Task ConfirmDelete(int contactId)
    {
        if (await JsRuntime.InvokeAsync<bool>("confirm", ["Are you sure you want to delete this contact?"]))
            await DeleteContact(contactId);
    }

  private async Task DeleteContact(int contactId)
  {
      try
      {
          _isLoading = true;
          await AddressBookApiService.DeleteContact(contactId);
          await LoadContacts();
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
}