using AngleSharp.Dom;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Domain lookup helpers over a rendered component: by <c>data-testid</c> (via
/// <see cref="TestIds"/>) and by <c>aria-label</c>. Locator priority: role/aria-label -> testid -> CSS.
/// </summary>
public static class RenderedComponentExtensions
{
    public static IElement FindByTestId<T>(this IRenderedComponent<T> cut, string testId)
        where T : IComponent =>
        cut.Find(TestIds.Selector(testId));

    public static IElement FindByAriaLabel<T>(this IRenderedComponent<T> cut, string label)
        where T : IComponent =>
        cut.Find($"[aria-label=\"{label}\"]");
}
