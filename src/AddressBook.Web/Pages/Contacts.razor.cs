using AddressBook.Contracts.Models;
using AddressBook.Web.Layout;
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace AddressBook.Web.Pages;

public partial class Contacts
{
    private string _searchString = String.Empty;
    private string _errorText = String.Empty;
    private MudMessageBox _confirmDeleteMessageBox = null!;
    private MudTable<ContactModel> _contactTable = null!;

    [Inject]
    private IAddressBookApiService AddressBookApiService { get; set; } = null!;

    [Inject]
    private NavigationManager Navigation { get; set; } = null!;
    
    private string ErrorVisibility => string.IsNullOrWhiteSpace(_errorText) ? "invisible" : "";

    [CascadingParameter]
    public Error Error { get; set; } = null!;

    private async Task<TableData<ContactModel>> ServerReload(TableState state, CancellationToken token)
    {
        try
        {
            var response = await AddressBookApiService.GetFilteredContactsAsync(_searchString, token);
            IEnumerable<ContactModel> data = response!.Rows;
            data = state.SortLabel switch
            {
                "fn_field" => data.OrderByDirection(state.SortDirection, o => o.FirstName),
                "ln_field" => data.OrderByDirection(state.SortDirection, o => o.LastName),
                "bd_field" => data.OrderByDirection(state.SortDirection, o => o.Birthday),
                _ => data
            };

            var totalItems = response.TotalRows;
            var pagedData = data.Skip(state.Page * state.PageSize).Take(state.PageSize).ToArray();
            _errorText = "";
            return new() { TotalItems = totalItems, Items = pagedData };
        }
        catch (Exception ex)
        {
            Error.ProcessError(ex.Message);
            _errorText = ex.Message;
            return new() { TotalItems = 0, Items = [] };
        }
    }

    private void OnSearch(string text)
    {
        _searchString = text;
        _contactTable.ReloadServerData();
    }

    private async Task DeleteContactAsync(int contactId)
    {
        var result = await _confirmDeleteMessageBox.ShowAsync();
        if (! (result ?? false))
            return;
        await AddressBookApiService.DeleteContact(contactId);
        await _contactTable.ReloadServerData();
    }

    private void ShowCreateContactForm() => 
        Navigation.NavigateTo("/create-contact");
}