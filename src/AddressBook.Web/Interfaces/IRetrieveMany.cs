namespace AddressBook.Web.Interfaces;

/// <summary>
/// Interface for retrieving many items
/// </summary>
/// <typeparam name="TOut">type of retrieved item</typeparam>
public interface IRetrieveMany<out TOut>
{
  /// <summary>
  /// Retrieves a collection of <typeparamref name="TOut"/> values, optionally using the specified transaction.
  /// </summary>
  /// <returns>An <see cref="IReadOnlyCollection{TOut}"/>.</returns>
  IReadOnlyCollection<TOut> RetrieveManyAsync();
}

/// <summary>
/// Interface for retrieving many items
/// </summary>
/// <typeparam name="TKey">key for searching</typeparam>
/// <typeparam name="TOut">type of retrieved item</typeparam>
public interface IRetrieveMany<in TKey, TOut>
{
  /// <summary>
  /// Retrieve many items by key
  /// </summary>
  /// <param name="key">key for searching</param>
  /// <returns>a collection of items</returns>
  Task<IReadOnlyCollection<TOut>> RetrieveManyAsync(TKey key);
}
