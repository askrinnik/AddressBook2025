namespace AddressBook.Web.Interfaces;

public interface IRetrieve<in TKey, TOut>
{
    Task<TOut?> TryRetrieveAsync(TKey key);
}