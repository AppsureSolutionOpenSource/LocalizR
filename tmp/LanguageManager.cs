using System;
namespace Com.Cool.Namespace
{
	public sealed class LanguageManager
	{
		private Language CurrentLanguage
		{
			get;
			set;
		}
		private LanguageManager()
		{
			current = Language.En;
		}
		public static LanguageManager Instance
		{
			get;
		} = new LanguageManager();
		public string Hello
		{
			get
			{
				return CurrentLanguage switch
				{
					case Language.En: return "Hello";
					case Language.Ro: return "Salut";
					default: return "$_Hello_$
				};
			}
		}
		public string World
		{
			get
			{
				return CurrentLanguage switch
				{
					case Language.En: return "World";
					case Language.Ro: return "Lume";
					default: return "$_World_$
				};
			}
		}
		public string Missing
		{
			get
			{
				return CurrentLanguage switch
				{
					case Language.En: return "Missing";
					case Language.Ro: return "$_Ro_Missing_$";
					default: return "$_Missing_$
				};
			}
		}
	}
}