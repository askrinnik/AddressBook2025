using AngleSharp.Dom;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Доменные хелперы поиска над отрендеренным компонентом: по <c>data-testid</c> (через
/// <see cref="TestIds"/>) и по <c>aria-label</c>. Приоритет локаторов: роль/aria-label → testid → CSS.
/// </summary>
public static class RenderedComponentExtensions
{
    public static IElement FindByTestId<T>(this IRenderedComponent<T> cut, string testId)
        where T : IComponent =>
        cut.Find(TestIds.Selector(testId));

    public static IReadOnlyList<IElement> FindAllByTestId<T>(this IRenderedComponent<T> cut, string testId)
        where T : IComponent =>
        cut.FindAll(TestIds.Selector(testId));

    /// <summary>Элемент с testid или <c>null</c>, если его нет в текущей разметке.</summary>
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
