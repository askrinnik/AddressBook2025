using System.Reflection;
using AddressBook.Web.Components;
using Microsoft.AspNetCore.Components.Forms;

namespace AddressBook.Web.Tests.Specs.Components;

public class CustomValidationSummaryTests : MudTestContext
{
    private const string ListSelector = "ul.validation-errors";
    private const string MessageSelector = "li.validation-message";

    private readonly FormModel _model = new();
    private readonly EditContext _editContext;
    private readonly ValidationMessageStore _messages;

    public CustomValidationSummaryTests()
    {
        _editContext = new EditContext(_model);
        _messages = new ValidationMessageStore(_editContext);
    }

    private FieldIdentifier ModelLevel => new(_model, string.Empty);

    private IRenderedComponent<CustomValidationSummary> RenderSummary() =>
        Render<CustomValidationSummary>(p => p.AddCascadingValue(_editContext));

    private static string[] ShownMessages(IRenderedComponent<CustomValidationSummary> cut) =>
        [.. cut.FindAll(MessageSelector).Select(li => li.TextContent)];

    [Fact]
    public void WithoutEditContext_RendersNothing()
    {
        var cut = Render<CustomValidationSummary>();

        Assert.Empty(cut.FindAll(ListSelector));
    }

    [Fact]
    public void WithoutMessages_RendersEmptyList()
    {
        var cut = RenderSummary();

        Assert.Single(cut.FindAll(ListSelector));
        Assert.Empty(ShownMessages(cut));
    }

    [Fact]
    public void OnlyFieldMessages_AreNotShown()
    {
        _messages.Add(_editContext.Field(nameof(FormModel.Name)), "Name is required.");
        _messages.Add(_editContext.Field(nameof(FormModel.Email)), "Email is invalid.");

        var cut = RenderSummary();

        Assert.Empty(ShownMessages(cut));
    }

    [Fact]
    public void ModelLevelMessages_AreShown()
    {
        _messages.Add(ModelLevel, "Contact already exists.");
        _messages.Add(ModelLevel, "Server is unavailable.");

        var cut = RenderSummary();

        Assert.Equal(["Contact already exists.", "Server is unavailable."], ShownMessages(cut));
    }

    [Fact]
    public void MixedMessages_OnlyModelLevelAreShown()
    {
        _messages.Add(_editContext.Field(nameof(FormModel.Name)), "Name is required.");
        _messages.Add(ModelLevel, "Contact already exists.");
        _messages.Add(_editContext.Field(nameof(FormModel.Email)), "Email is invalid.");

        var cut = RenderSummary();

        Assert.Equal(["Contact already exists."], ShownMessages(cut));
    }

    [Fact]
    public async Task MessageAddedAfterRender_AppearsOnValidationStateChanged()
    {
        var cut = RenderSummary();
        Assert.Empty(ShownMessages(cut));

        _messages.Add(ModelLevel, "Contact already exists.");
        await cut.InvokeAsync(_editContext.NotifyValidationStateChanged);

        cut.WaitForAssertion(() => Assert.Equal(["Contact already exists."], ShownMessages(cut)));
    }

    [Fact]
    public async Task MessagesCleared_ListEmptiesOnValidationStateChanged()
    {
        _messages.Add(ModelLevel, "Contact already exists.");
        var cut = RenderSummary();
        Assert.Single(ShownMessages(cut));

        _messages.Clear();
        await cut.InvokeAsync(_editContext.NotifyValidationStateChanged);

        cut.WaitForAssertion(() => Assert.Empty(ShownMessages(cut)));
    }

    [Fact]
    public async Task Dispose_UnsubscribesFromValidationStateChanged()
    {
        var cut = RenderSummary();
        var summary = cut.Instance;
        Assert.Contains(ValidationStateChangedSubscribers(), handler => handler.Target == summary);

        await DisposeComponentsAsync();

        Assert.DoesNotContain(ValidationStateChangedSubscribers(), handler => handler.Target == summary);
        // Raising the event after disposal must not throw: no handler of the disposed component is left to run.
        _editContext.NotifyValidationStateChanged();
    }

    [Fact]
    public void ModelLevelMessageWithSameTextAsFieldMessage_IsShown()
    {
        _messages.Add(_editContext.Field(nameof(FormModel.Name)), "Required.");
        _messages.Add(ModelLevel, "Required.");

        var cut = RenderSummary();

        Assert.Equal(["Required."], ShownMessages(cut));
    }

    [Fact]
    public void NestedObjectFieldMessage_IsNotShown()
    {
        _messages.Add(new FieldIdentifier(_model.Address, nameof(AddressModel.City)), "City is required.");

        var cut = RenderSummary();

        Assert.Empty(ShownMessages(cut));
    }

    /// <summary>
    /// Reads the handlers subscribed to <see cref="EditContext.OnValidationStateChanged"/> from the event's
    /// compiler-generated backing field: a disposed component ignores <c>StateHasChanged</c>, so the rendered
    /// markup cannot reveal a subscription that outlives the component.
    /// </summary>
    private Delegate[] ValidationStateChangedSubscribers()
    {
        var field = typeof(EditContext).GetField(
            nameof(EditContext.OnValidationStateChanged), BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(field);

        return field.GetValue(_editContext) is Delegate handlers ? handlers.GetInvocationList() : [];
    }

    private sealed class FormModel
    {
        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public AddressModel Address { get; } = new();
    }

    private sealed class AddressModel
    {
        public string City { get; set; } = string.Empty;
    }
}
