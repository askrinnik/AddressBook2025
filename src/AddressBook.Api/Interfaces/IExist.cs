namespace AddressBook.Api.Interfaces;

/// <summary>
/// Interface for checking if an entity of type <typeparamref name="T"/> exists.
/// </summary>
public interface IExist<in T>
{
    /// <summary>
    /// Check if an entity of type <typeparamref name="T"/> exists.
    /// </summary>
    /// <param name="key">an entity id</param>
    /// <returns></returns>
    public Task<bool> ExistAsync(T key);
}