namespace AddressBook.Api.Interfaces;

/// <summary>
/// Interface for retrieving a single item
/// </summary>
/// <typeparam name="TKey">key for searching</typeparam>
/// <typeparam name="TOut">type of the retrieved item</typeparam>
public interface IRetrieve<in TKey, TOut>
{
  /// <summary>
  /// Retrieve an item by key
  /// </summary>
  /// <param name="key">key for searching</param>
  /// <returns>item instance or null</returns>
  Task<TOut?> TryRetrieveAsync(TKey key);
}