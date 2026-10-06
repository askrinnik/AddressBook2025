using AddressBook.Web.Models;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Harnesses;

/// <summary>
/// Wrapper for the contact form shared by <c>CreateContact</c> and <c>EditContact</c>: fill in fields,
/// submit/cancel, values, validation errors and waiting for navigation. It also exposes the page states of
/// <c>EditContact</c> around the form: the load progress indicator, the load error alert and its
/// "Back to Contacts" button. Hides the MudBlazor markup (the testid sits directly on the <c>input</c>;
/// the birthday field is readonly, its value is set via <c>DateChanged</c> of <see cref="MudDatePicker"/>).
/// </summary>
public sealed class ContactFormHarness(IRenderedComponent<IComponent> cut)
{
    private const string BackToContactsText = "Back to Contacts";

    public string FirstName => cut.FindByTestId(TestIds.ContactFormFirstName).GetAttribute("value") ?? string.Empty;

    public string LastName => cut.FindByTestId(TestIds.ContactFormLastName).GetAttribute("value") ?? string.Empty;

    /// <summary>Texts of the field labels (<c>label.mud-input-label</c>) in render order.</summary>
    public IReadOnlyList<string> FieldLabels =>
        cut.FindAll("label.mud-input-label")
            .Select(e => e.TextContent.Trim())
            .Where(t => t.Length > 0)
            .ToList();

    public DateTime? Birthday => cut.FindComponent<MudDatePicker>().Instance.Date;

    /// <summary>The latest date the birthday picker offers (the <c>MaxDate</c> of the <see cref="MudDatePicker"/>).</summary>
    public DateTime? BirthdayMaxDate => cut.FindComponent<MudDatePicker>().Instance.MaxDate;

    public bool IsSubmitDisabled => cut.FindByTestId(TestIds.ContactFormSubmit).HasAttribute("disabled");

    public string SubmitText => cut.FindByTestId(TestIds.ContactFormSubmit).TextContent.Trim();

    /// <summary>
    /// All visible validation messages: MudBlazor field hints (<c>For=</c>) and <c>ValidationSummary</c>.
    /// </summary>
    public IReadOnlyList<string> ValidationMessages =>
        cut.FindAll(".mud-input-helper-text.mud-input-error, .validation-errors li, .validation-message")
            .Select(e => e.TextContent.Trim())
            .Where(t => t.Length > 0)
            .Distinct()
            .ToList();

    /// <summary>True when the form is rendered: its first-name field or its submit button is present.</summary>
    public bool IsFormShown =>
        cut.FindAll(TestIds.Selector(TestIds.ContactFormFirstName)).Count > 0
        || cut.FindAll(TestIds.Selector(TestIds.ContactFormSubmit)).Count > 0;

    /// <summary>True when the load progress indicator (<c>[role=progressbar]</c>) is rendered.</summary>
    public bool IsProgressShown => cut.FindAll("[role=progressbar]").Count > 0;

    /// <summary>Text of the page alert (<c>.mud-alert</c>), or <c>null</c> when no alert is rendered.</summary>
    public string? AlertText => cut.FindAll(".mud-alert").FirstOrDefault()?.TextContent.Trim();

    /// <summary>CSS classes of the page alert (e.g. <c>mud-alert-text-warning</c>); throws when no alert is rendered.</summary>
    public IReadOnlyList<string> AlertClasses => cut.Find(".mud-alert").ClassList.ToList();

    /// <summary>True when the "Back to Contacts" button is rendered.</summary>
    public bool HasBackToContacts => cut.FindAll("button").Any(IsBackToContacts);

    public ContactFormHarness SetFirstName(string value)
    {
        cut.FindByTestId(TestIds.ContactFormFirstName).Change(value);
        return this;
    }

    public ContactFormHarness SetLastName(string value)
    {
        cut.FindByTestId(TestIds.ContactFormLastName).Change(value);
        return this;
    }

    /// <summary>The birthday field is readonly (no text input) - set the value via <see cref="MudDatePicker"/>.</summary>
    public async Task<ContactFormHarness> SetBirthdayAsync(DateTime? value)
    {
        var picker = cut.FindComponent<MudDatePicker>();
        await cut.InvokeAsync(() => picker.Instance.DateChanged.InvokeAsync(value));
        return this;
    }

    public Task<ContactFormHarness> FillAsync(CreateContactModel model) =>
        SetFirstName(model.FirstName).SetLastName(model.LastName).SetBirthdayAsync(model.Birthday);

    /// <summary>Click on the submit button ("Create"/"Save"); bUnit turns it into a form submit.</summary>
    public void Submit() => cut.FindByTestId(TestIds.ContactFormSubmit).Click();

    public void Cancel() => cut.FindByTestId(TestIds.ContactFormCancel).Click();

    /// <summary>Click on the "Back to Contacts" button shown with the load error alert.</summary>
    public void BackToContacts() => cut.FindAll("button").Single(IsBackToContacts).Click();

    /// <summary>
    /// Waits until the current path of the <see cref="NavigationManager"/> equals <paramref name="path"/>
    /// (e.g. after a submit whose API call completes later).
    /// </summary>
    public void WaitForNavigation(string path)
    {
        var navigation = cut.Services.GetRequiredService<NavigationManager>();
        cut.WaitForAssertion(() => Assert.Equal(path, new Uri(navigation.Uri).AbsolutePath));
    }

    /// <summary>Waits until the form replaces the load progress indicator.</summary>
    public void WaitForFormShown() => cut.WaitForState(() => IsFormShown);

    private static bool IsBackToContacts(AngleSharp.Dom.IElement button) => button.TextContent.Trim() == BackToContactsText;
}
