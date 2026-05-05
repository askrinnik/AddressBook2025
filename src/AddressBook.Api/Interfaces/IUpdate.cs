namespace AddressBook.Api.Interfaces;

/// <summary>
/// Interface for updating an existing item
/// </summary>
/// <typeparam name="TKey">type of the item key</typeparam>
/// <typeparam name="T">type of the item</typeparam>
public interface IUpdate<in TKey, in T>
{
  /// <summary>
  /// Update an existing item
  /// </summary>
  /// <param name="key">key of the item to update</param>
  /// <param name="item">item with updated values</param>
  /// <returns>true if the item was found and updated; false if not found</returns>
  Task<bool> UpdateAsync(TKey key, T item);
}
