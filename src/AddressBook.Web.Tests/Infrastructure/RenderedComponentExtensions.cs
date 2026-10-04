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

    public static IReadOnlyList<IElement> FindAllByTestId<T>(this IRenderedComponent<T> cut, string testId)
        where T : IComponent =>
        cut.FindAll(TestIds.Selector(testId));

    /// <summary>The element with the testid, or <c>null</c> if it is not in the current markup.</summary>
    public static IElement? TryFindByTestId<T>(this IRenderedComponent<T> cut, string testId)
        where T : IComponent =>
        cut.FindAll(TestIds.Selector(testId)).FirstOrDefault();

    public static bool HasTestId<T>(this IRenderedComponent<T> cut, string testId)
        where T : IComponent =>
        cut.TryFindByTestId(testId) is not null;

    public static IElement FindByAriaLabel<T>(this IRenderedComponent<T> cut, string label)
        where T : IComponent =>
        cut.Find($"[aria-label=\"{label}\"]");

    public static IElement? TryFindByAriaLabel<T>(this IRenderedComponent<T> cut, string label)
        where T : IComponent =>
        cut.FindAll($"[aria-label=\"{label}\"]").FirstOrDefault();
}
