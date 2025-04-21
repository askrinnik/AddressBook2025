using AddressBook.Contracts.Models;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Pages;

public partial class Contacts
{
    private string _status = "Press Search button";
    private string _searchTerm = string.Empty;
    private ContactModel[]? _contacts;
    private bool _isLoading;
    private int _contactIdToDelete;
    private bool _dialogIsOpen;

    [Inject]
    public IAddressBookApiService AddressBookApiService { get; set; } = null!;

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

    private void ShowConfirmationDialog(int contactId)
    {
        _contactIdToDelete = contactId;
        _dialogIsOpen = true;
    }

    private async Task ConfirmDeleteAction()
    {
        await DeleteContact(_contactIdToDelete);
        _dialogIsOpen = false;
    }

    private void CancelDeleteAction()
    {
        _dialogIsOpen = false;
    }
}