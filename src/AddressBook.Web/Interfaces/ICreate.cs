namespace AddressBook.Web.Interfaces;

public interface ICreate<T>
{
    Task<T> CreateAsync(T item);
}