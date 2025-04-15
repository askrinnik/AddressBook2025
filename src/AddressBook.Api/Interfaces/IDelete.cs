namespace AddressBook.Api.Interfaces;

/// <summary>
/// Represents an object that can delete of an entity of type
/// <typeparamref name="T"/>.
/// </summary>
/// <typeparam name="T">The type persisted.</typeparam>
public interface IDelete<in T>
{
    /// <summary>
    /// Persists a deletion of an instance of <typeparamref name="T"/>, optionally
    /// using the specified transaction.
    /// </summary>
    /// <param name="key">The entity key to delete.</param>
    /// <returns>Total number of rows, deleted by the query</returns>
    Task<int> DeleteAsync(T key);
}
