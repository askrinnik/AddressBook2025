using AddressBook.Contracts.Models;
using AddressBook.Contracts;
using AddressBook.Web.Models;
using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Specs.Pages;

public class EditContactTests : MudTestContext
{
    private static readonly string FirstNameTooLong = $"The field First name must be a string with a maximum length of {ContactRules.NameMaxLength}.";
    private static readonly string LastNameTooLong = $"The field Last name must be a string with a maximum length of {ContactRules.NameMaxLength}.";
    private const string BirthdayInFutureMessage = ContactRules.BirthdayInFutureMessage;

    private static string PathFor(int id) => $"/edit-contact/{id}";

    private ContactFormHarness RenderForm(ContactModel contact)
    {
        ApiService.ReturnsContact(contact);
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo(PathFor(contact.Id));
        return new ContactFormHarness(Render<EditContact>(p => p.Add(x => x.Id, contact.Id)));
    }

    [Fact]
    public void Render_ExistingContact_PrefillsFormFromApi()
    {
        var contact = ContactBuilder.Existing.Valid();

        var form = RenderForm(contact);

        Assert.Equal(contact.FirstName, form.FirstName);
        Assert.Equal(contact.LastName, form.LastName);
        Assert.Equal(contact.Birthday!.Value.ToDateTime(TimeOnly.MinValue), form.Birthday);
        Assert.Equal("Save", form.SubmitText);
    }

    [Fact]
    public void Render_ContactWithoutBirthday_LeavesBirthdayEmpty()
    {
        var form = RenderForm(ContactBuilder.Existing.WithoutBirthday());

        Assert.Null(form.Birthday);
    }

    [Fact]
    public void Submit_UnchangedForm_UpdatesContactWithPrefilledValues_AndNavigatesToContacts()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);

        form.Submit();

        ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m =>
                m.FirstName == contact.FirstName && m.LastName == contact.LastName &&
                m.Birthday == contact.Birthday!.Value.ToDateTime(TimeOnly.MinValue)),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_EditedForm_UpdatesContactWithNewValues_AndNavigatesToContacts()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        var edited = ContactBuilder.New.Valid();
        await form.FillAsync(edited);

        form.Submit();

        await ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m =>
                m.FirstName == edited.FirstName && m.LastName == edited.LastName && m.Birthday == edited.Birthday),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_BirthdayCleared_UpdatesContactWithoutBirthday()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        await form.SetBirthdayAsync(null);

        form.Submit();

        await ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m => m.Birthday == null),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Submit_NamesCleared_BlocksSubmit_AndShowsRequiredMessagesForBothFields()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);

        form.SetFirstName(string.Empty).SetLastName(string.Empty).Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Equal(PathFor(contact.Id), CurrentPath);
        Assert.Contains("The First name field is required.", form.ValidationMessages);
        Assert.Contains("The Last name field is required.", form.ValidationMessages);
    }

    [Fact]
    public void Submit_LoadedFirstName31Chars_BlocksSubmit_AndShowsLengthMessage()
    {
        var contact = ContactBuilder.Existing.FirstName31Chars();
        var form = RenderForm(contact);

        form.Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Equal(PathFor(contact.Id), CurrentPath);
        Assert.Contains(FirstNameTooLong, form.ValidationMessages);
    }

    [Fact]
    public void Submit_LoadedBirthdayInFuture_BlocksSubmit_AndShowsBirthdayMessage()
    {
        var contact = ContactBuilder.Existing.BirthdayInFuture();
        var form = RenderForm(contact);

        form.Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Equal(PathFor(contact.Id), CurrentPath);
        Assert.Contains(BirthdayInFutureMessage, form.ValidationMessages);
    }

    [Fact]
    public async Task Submit_FirstName30Chars_UpdatesContact()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        var edited = ContactBuilder.New.FirstName30Chars();
        await form.FillAsync(edited);

        form.Submit();

        await ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m => m.FirstName == edited.FirstName),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_LastName30Chars_UpdatesContact()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        var edited = ContactBuilder.New.LastName30Chars();
        await form.FillAsync(edited);

        form.Submit();

        await ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m => m.LastName == edited.LastName),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_FirstName31Chars_BlocksSubmit_AndShowsLengthMessage()
    {
        var form = RenderForm(ContactBuilder.Existing.Valid());
        await form.FillAsync(ContactBuilder.New.FirstName31Chars());

        form.Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Contains(FirstNameTooLong, form.ValidationMessages);
    }

    [Fact]
    public async Task Submit_LastName31Chars_BlocksSubmit_AndShowsLengthMessage()
    {
        var form = RenderForm(ContactBuilder.Existing.Valid());
        await form.FillAsync(ContactBuilder.New.LastName31Chars());

        form.Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Contains(LastNameTooLong, form.ValidationMessages);
    }

    [Fact]
    public void Submit_WhitespaceNames_BlocksSubmit_AndShowsRequiredMessages()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);

        form.SetFirstName("   ").SetLastName("   ").Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Contains("The First name field is required.", form.ValidationMessages);
        Assert.Contains("The Last name field is required.", form.ValidationMessages);
    }

    [Fact]
    public async Task Submit_BirthdayToday_UpdatesContact()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        var edited = ContactBuilder.New.BirthdayToday();
        await form.FillAsync(edited);

        form.Submit();

        await ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m => m.Birthday == edited.Birthday),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_BirthdayInFuture_BlocksSubmit_AndShowsBirthdayMessage()
    {
        var form = RenderForm(ContactBuilder.Existing.Valid());
        await form.FillAsync(ContactBuilder.New.BirthdayInFuture());

        form.Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Contains(BirthdayInFutureMessage, form.ValidationMessages);
    }

    [Fact]
    public void Render_BirthdayPickerMaxDate_IsUtcToday()
    {
        UseClock(FixedTimeProvider.LocalDayAheadOfUtc());

        var form = RenderForm(ContactBuilder.Existing.Valid());

        Assert.Equal(FixedTimeProvider.LateUtcEveningUtcDate, form.BirthdayMaxDate);
    }

    [Fact]
    public async Task Submit_BirthdayUtcTomorrowButLocalToday_BlocksSubmit()
    {
        UseClock(FixedTimeProvider.LocalDayAheadOfUtc());
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        await form.FillAsync(ContactBuilder.New.WithBirthday(FixedTimeProvider.LateUtcEveningLocalDate));

        form.Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Equal(PathFor(contact.Id), CurrentPath);
        Assert.Contains(BirthdayInFutureMessage, form.ValidationMessages);
    }

    [Fact]
    public void Render_ShowsSentenceCaseFieldLabels()
    {
        var form = RenderForm(ContactBuilder.Existing.Valid());

        Assert.Contains("First name", form.FieldLabels);
        Assert.Contains("Last name", form.FieldLabels);
    }

    [Fact]
    public async Task Cancel_NavigatesToContacts_WithoutUpdating()
    {
        var form = RenderForm(ContactBuilder.Existing.Valid());
        await form.FillAsync(ContactBuilder.New.Valid());

        form.Cancel();

        ApiService.DidNotReceiveUpdate();
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Submit_WhileUpdateIsPending_DisablesSubmitButton_UntilItCompletes()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        var pending = new TaskCompletionSource();
        ApiService.UpdateContact(contact.Id, Arg.Any<CreateContactModel>(), Arg.Any<CancellationToken>())
            .Returns(pending.Task);
        Assert.False(form.IsSubmitDisabled);

        form.Submit();

        Assert.True(form.IsSubmitDisabled);
        Assert.Equal(PathFor(contact.Id), CurrentPath);

        pending.SetResult();

        form.WaitForNavigation("/contacts");
    }
}
