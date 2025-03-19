namespace AddressBook.Web.Interfaces;

/// <summary>
/// Interface for creating a new item
/// </summary>
/// <typeparam name="T">type of the item</typeparam>
public interface ICreate<T>
{
  /// <summary>
  /// Create a new item
  /// </summary>
  /// <param name="item">item to create</param>
  /// <returns>a created item</returns>
  Task<T> CreateAsync(T item);
}