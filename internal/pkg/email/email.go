package email

import (
	"gin-notebook/configs"
	"gin-notebook/pkg/logger"
	"strings"

	"github.com/wneessen/go-mail"
)

func SendEmail(to string, subject string, body string) error {
	c := configs.Configs.Email
	message := mail.NewMsg()
	if err := message.From(c.User); err != nil {
		logger.LogError(err, "failed to set From address")
		return err
	}
	if err := message.To(to); err != nil {
		logger.LogError(err, "failed to set To address")
		return err
	}
	message.Subject(subject)
	message.SetBodyString(mail.TypeTextHTML, body)

	client, err := mail.NewClient(c.Host,
		mail.WithPort(c.Port),
		mail.WithSSL(),
		mail.WithSMTPAuth(mail.SMTPAuthPlain),
		mail.WithUsername(c.User),
		mail.WithPassword(c.Password),
	)

	if err != nil {
		logger.LogError(err, "failed to create mail client")
		return err
	}

	if err := client.DialAndSend(message); err != nil {
		if strings.Contains(err.Error(), "not connected to SMTP server") {
			// 这只是连接清理时的警告，可以忽略
			logger.LogDebug("SMTP server not connected", map[string]interface{}{
				"error": err.Error(),
			})
		} else {
			// 真正的发送错误
			logger.LogError(err, "failed to send mail")
			return err
		}
	}
	return nil
}
