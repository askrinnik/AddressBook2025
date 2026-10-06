using AddressBook.Web.Models;
using Microsoft.AspNetCore.Components;
using AddressBook.Web.Pages;

namespace AddressBook.Web.Tests.Tests.Pages;

public class CreateContactTests : MudTestContext
{
    private const string InitialPath = "/create-contact";
    private const string FirstNameRequired = "The First name field is required.";
    private const string LastNameRequired = "The Last name field is required.";

    private IRenderedComponent<CreateContact> _cut = null!;

    private ContactFormHarness RenderForm()
    {
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo(InitialPath);
        _cut = Render<CreateContact>();
        return new ContactFormHarness(_cut);
    }

    [Fact]
    public void Submit_EmptyNames_BlocksSubmit_AndShowsRequiredMessagesForBothFields()
    {
        var form = RenderForm();

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Equal(InitialPath, CurrentPath);
        Assert.Contains(FirstNameRequired, form.ValidationMessages);
        Assert.Contains(LastNameRequired, form.ValidationMessages);
    }

    [Fact]
    public void Render_ShowsSentenceCaseFieldLabels()
    {
        var form = RenderForm();

        Assert.Contains("First name", form.FieldLabels);
        Assert.Contains("Last name", form.FieldLabels);
    }

    [Fact]
    public void Submit_OnlyFirstNameEmpty_BlocksSubmit_AndShowsOnlyFirstNameMessage()
    {
        var form = RenderForm();
        form.SetLastName(ContactBuilder.New.Valid().LastName);

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Contains(FirstNameRequired, form.ValidationMessages);
        Assert.DoesNotContain(LastNameRequired, form.ValidationMessages);
    }

    [Fact]
    public void Submit_OnlyLastNameEmpty_BlocksSubmit_AndShowsOnlyLastNameMessage()
    {
        var form = RenderForm();
        form.SetFirstName(ContactBuilder.New.Valid().FirstName);

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Contains(LastNameRequired, form.ValidationMessages);
        Assert.DoesNotContain(FirstNameRequired, form.ValidationMessages);
    }

    [Fact]
    public void Submit_ValidForm_CreatesContact_AndNavigatesToContacts()
    {
        var form = RenderForm();
        var model = ContactBuilder.New.Valid();
        ApiService.ReturnsCreatedId(1);

        form.Fill(model).Submit();

        ApiService.Received(1).CreateContact(Arg.Is<CreateContactModel>(m =>
            m.FirstName == model.FirstName && m.LastName == model.LastName && m.Birthday == model.Birthday));
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Submit_WithoutBirthday_CreatesContact_AndNavigatesToContacts()
    {
        var form = RenderForm();
        var model = ContactBuilder.New.WithoutBirthday();
        ApiService.ReturnsCreatedId(1);

        form.Fill(model).Submit();

        ApiService.Received(1).CreateContact(Arg.Is<CreateContactModel>(m =>
            m.FirstName == model.FirstName && m.LastName == model.LastName && m.Birthday == null));
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Cancel_NavigatesToContacts_WithoutCreating()
    {
        var form = RenderForm();
        form.Fill(ContactBuilder.New.Valid());

        form.Cancel();

        ApiService.DidNotReceiveCreate();
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Submit_WhileCreateIsPending_DisablesSubmitButton_UntilItCompletes()
    {
        var form = RenderForm();
        var pending = new TaskCompletionSource<int>();
        ApiService.CreateContact(Arg.Any<CreateContactModel>()).Returns(pending.Task);
        form.Fill(ContactBuilder.New.Valid());
        Assert.False(form.IsSubmitDisabled);

        form.Submit();

        Assert.True(form.IsSubmitDisabled);
        Assert.Equal(InitialPath, CurrentPath);

        pending.SetResult(1);

        _cut.WaitForAssertion(() => Assert.Equal("/contacts", CurrentPath));
    }
}
