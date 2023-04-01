using System;
namespace Com.Cool.Namespace
{
	public sealed class LanguageInfo
	{
		public static string ObtainDescription(Language language)
		{
			switch(language):
			{
				case En: return "English";
				case Ro: return "Română";
				default: throw new Exception("No such language.")
			}
		}
		public static int ObtainPriority(Language language)
		{
			switch(language):
			{
				case En: return "999";
				case Ro: return "35";
				default: throw new Exception("No such language.")
			}
		}
	}
}