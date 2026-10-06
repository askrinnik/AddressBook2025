using AddressBook.Contracts.Models;
using AddressBook.Web.Models;
using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Tests.Pages;

public class EditContactTests : MudTestContext
{
    private const string FirstNameTooLong = "The field First name must be a string with a maximum length of 30.";
    private const string LastNameTooLong = "The field Last name must be a string with a maximum length of 30.";
    private const string BirthdayInFutureMessage = "Birthday cannot be in the future";

    private IRenderedComponent<EditContact> _cut = null!;

    private static string PathFor(int id) => $"/edit-contact/{id}";

    private ContactFormHarness RenderForm(ContactModel contact)
    {
        ApiService.ReturnsContact(contact);
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo(PathFor(contact.Id));
        _cut = Render<EditContact>(p => p.Add(x => x.Id, contact.Id));
        return new ContactFormHarness(_cut);
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
    public void Submit_EditedForm_UpdatesContactWithNewValues_AndNavigatesToContacts()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        var edited = ContactBuilder.New.Valid();

        form.Fill(edited).Submit();

        ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m =>
                m.FirstName == edited.FirstName && m.LastName == edited.LastName && m.Birthday == edited.Birthday),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Submit_BirthdayCleared_UpdatesContactWithoutBirthday()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);

        form.SetBirthday(null).Submit();

        ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m => m.Birthday == null),
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
    public void Submit_FirstName30Chars_UpdatesContact()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        var edited = ContactBuilder.New.FirstName30Chars();

        form.Fill(edited).Submit();

        ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m => m.FirstName == edited.FirstName),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Submit_LastName30Chars_UpdatesContact()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);
        var edited = ContactBuilder.New.LastName30Chars();

        form.Fill(edited).Submit();

        ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m => m.LastName == edited.LastName),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Submit_FirstName31Chars_BlocksSubmit_AndShowsLengthMessage()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);

        form.Fill(ContactBuilder.New.FirstName31Chars()).Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Contains(FirstNameTooLong, form.ValidationMessages);
    }

    [Fact]
    public void Submit_LastName31Chars_BlocksSubmit_AndShowsLengthMessage()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);

        form.Fill(ContactBuilder.New.LastName31Chars()).Submit();

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
    public void Submit_BirthdayToday_UpdatesContact()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);

        form.Fill(ContactBuilder.New.BirthdayToday()).Submit();

        ApiService.Received(1).UpdateContact(contact.Id, Arg.Is<CreateContactModel>(m => m.Birthday == DateTime.Today),
            Arg.Any<CancellationToken>());
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Submit_BirthdayInFuture_BlocksSubmit_AndShowsBirthdayMessage()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderForm(contact);

        form.Fill(ContactBuilder.New.BirthdayInFuture()).Submit();

        ApiService.DidNotReceiveUpdate();
        Assert.Contains(BirthdayInFutureMessage, form.ValidationMessages);
    }

    [Fact]
    public void Render_BirthdayPickerMaxDate_IsToday()
    {
        var form = RenderForm(ContactBuilder.Existing.Valid());

        Assert.Equal(DateTime.Today, form.BirthdayMaxDate);
    }

    [Fact]
    public void Render_ShowsSentenceCaseFieldLabels()
    {
        var form = RenderForm(ContactBuilder.Existing.Valid());

        Assert.Contains("First name", form.FieldLabels);
        Assert.Contains("Last name", form.FieldLabels);
    }

    [Fact]
    public void Cancel_NavigatesToContacts_WithoutUpdating()
    {
        var form = RenderForm(ContactBuilder.Existing.Valid());
        form.Fill(ContactBuilder.New.Valid());

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

        _cut.WaitForAssertion(() => Assert.Equal("/contacts", CurrentPath));
    }
}
