using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;

namespace AddressBook.Web.Components;

/// <summary>
/// Validation summary that lists only the model-level messages of the cascading <see cref="EditContext"/>;
/// per-field messages are left to the field-level validation messages.
/// </summary>
public partial class CustomValidationSummary
{
    [CascadingParameter] private EditContext? EditContext { get; set; }

    /// <summary>
    /// Messages stored for the model itself (an empty field name), the same key the built-in
    /// <see cref="ValidationSummary"/> uses for its <c>Model</c> parameter. Selecting by key rather than by
    /// message text keeps a model-level message visible when a field carries the same text, and keeps
    /// messages of nested objects' fields out of the summary.
    /// </summary>
    private IEnumerable<string> ValidationMessages =>
        EditContext is null
            ? []
            : EditContext.GetValidationMessages(new FieldIdentifier(EditContext.Model, string.Empty));

    /// <summary>Subscribes to validation state changes so the list refreshes when messages change.</summary>
    protected override void OnInitialized() =>
        EditContext?.OnValidationStateChanged += ValidationStateChangedHandler;

    /// <summary>Unsubscribes from the <see cref="EditContext"/>, which may outlive this component.</summary>
    public void Dispose() =>
        EditContext?.OnValidationStateChanged -= ValidationStateChangedHandler;

    private void ValidationStateChangedHandler(object? sender, ValidationStateChangedEventArgs args) =>
        StateHasChanged();
}
